Create table Users (
  username varchar(30) primary key,
  firstn varchar(15),
  lastn varchar(15),
  email varchar(30) unique,
  number varchar(10) unique NOT NULL,
  password varchar(15) NOT NULL,
);