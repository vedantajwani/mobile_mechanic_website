import { supabase } from "./supabaseClient";
import { v4 as uuidv4 } from "uuid";
import imageCompression from "browser-image-compression";

type UploadProps = {
    file: File;
    bucket: string;
    folder?: string;
};

export const uploadImage = async ({ file, bucket, folder }: UploadProps) => {
    const ext = file.name.slice(file.name.lastIndexOf(".") + 1);
    const path = `${folder ? `${folder}/` : ""}${uuidv4()}.${ext}`;

    try {
        file = await imageCompression(file, { maxSizeMB: 1 });
    } catch (error) {
        console.error("Image compression failed:", error);
        return { imageUrl: "", error: "Image compression failed" };
    }

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { contentType: file.type });

    if (error || !data) {
        console.error("Image upload failed:", error);
        return { imageUrl: "", error: "Image upload failed" };
    }

    const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${data.path}`;
    return { imageUrl, error: "" };
};

export const deleteImage = async (imageUrl: string) => {
    const parts = imageUrl.split("/storage/v1/object/public/");
    if (parts.length < 2) return { data: null, error: "Invalid image URL" };

    const bucketAndPath = parts[1];
    const firstSlash = bucketAndPath.indexOf("/");

    const bucket = bucketAndPath.slice(0, firstSlash);
    const path = bucketAndPath.slice(firstSlash + 1);

    const { data, error } = await supabase.storage.from(bucket).remove([path]);
    return { data, error };
};
