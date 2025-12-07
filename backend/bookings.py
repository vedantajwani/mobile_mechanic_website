from fastapi import FastAPI, HTTPException, Query
from sqlalchemy import create_engine, text
from pydantic import BaseModel, EmailStr, HttpUrl
from dotenv import load_dotenv
import os
from pathlib import Path
from datetime import datetime
from typing import Optional
from datetime import datetime as dt
from fastapi.middleware.cors import CORSMiddleware
from urllib.parse import quote

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL, connect_args={"sslmode": "require"})

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

def get_db():
    with engine.begin() as conn:
        yield conn

class Booking(BaseModel):
    email: EmailStr
    make: str
    model: str
    year: str | None = None
    address: str
    description: str
    datetime: datetime

class BookingImg(BaseModel):
    booking_id: str
    image_url: HttpUrl

class EditBooking(BaseModel):
    id: str
    email: EmailStr | None = None
    make: str | None = None
    model: str | None = None
    year: str | None = None
    address: str | None = None
    description: str | None = None
    datetime: Optional[dt] = None

def get_table_name(test:bool):
    return '"Test_User"' if test else '"BookingInfo"'

@app.post("/add-new-booking")
def new_booking(booking: Booking, test: bool = Query(default=False)):
    table = get_table_name(test)
    '''query = text(""" INSERT INTO "BookingInfo" (email, make, model, year, address, description, datetime)
                 VALUES (:email, :make, :model, :year, :address, :description, :datetime) 
                 RETURNING id; """)'''
    query = text(f"""
        INSERT INTO {table} (email, make, model, year, address, description, datetime)
        VALUES (:email, :make, :model, :year, :address, :description, :datetime)
        RETURNING id;
    """)
    try:
        with engine.begin() as conn:
            res = conn.execute(query, booking.model_dump())
            booking_id = res.scalar()
        return{"message":f"New booking added into {table}"}
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error adding booking: {str(e)}")

@app.delete("/delete-booking")
def delete_booking(email: EmailStr, date_time: datetime, test:bool = Query(default=False)):
    table = get_table_name(test)
    query = text(f""" DELETE from {table} WHERE email = :email AND datetime = :datetime
                 RETURNING id; """)
    try:
        with engine.begin() as conn:
            res = conn.execute(query, {"email": email, "datetime": date_time})
            del_id = res.scalar()
            if not del_id:
                raise HTTPException(status_code=404, detail="No booking found")
        return {"message": f"Booking deleted successfully from {table}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail = f"Error deleting booking: {str(e)}")

@app.get("/get-bookings")  
def get_all_bookings(test:bool = Query(default=False)):
    table = get_table_name(test)
    query = text(f""" SELECT * FROM {table} ORDER BY datetime DESC; """)
    try:
        with engine.begin() as conn:
            res = conn.execute(query)
            bookings = [dict(row._mapping) for row in res]
        return {"Bookings": bookings}
    except Exception as e:
        raise HTTPException(status_code=400, detail = f"Error fetch bookings: {str(e)}")
    
@app.put("/edit-booking")
def edit_booking(edit: EditBooking, test:bool = Query(default=False)):
    table = get_table_name(test)
    fields = []
    params = {"id":edit.id}
    for key, value in edit.model_dump(exclude_unset=True).items():
        if (key != "id"):
            fields.append(f'{key} = :{key}')
            params[key] = value
    if (len(fields) == 0):
        raise HTTPException(status_code=400, detail="No fields provided for update")
    
    query = text(f'''
        UPDATE {table}
        SET {",".join(fields)}
        WHERE id = :id
        RETURNING id;
    ''')
    try: 
        with engine.begin() as conn:
            res = conn.execute(query, params)
            updated_ornot = res.scalar()
            if not updated_ornot:
                raise HTTPException(status_code=404, detail="Booking not found")
        return {"message": "Booking updated successfully"}
    except HTTPException:
        raise 
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error updating booking: {str(e)}")


    
@app.post("/add-booking-image")
def add_image(img: BookingImg):
    query = text(""" INSERT INTO booking_images (booking_id, image_url)
                 VALUES (:booking_id, :image_url)
                 RETURNING id, uploaded_at; """)
    try:
        with engine.begin() as conn:
            res = conn.execute(query, img.model_dump())
            new_img = res.mappings().first()
            return {"message": "Image added successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail = f"Error adding image: {str(e)}")


    
