import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { join } from "path";

@Controller("upload") // 👈 QUAN TRỌNG: giữ nguyên để khớp client chat
export class UploadController {
  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: join(process.cwd(), "uploads"),
        filename: (_, file, cb) => {
          const unique = Date.now() + "-" + file.originalname;
          cb(null, unique);
        },
      }),
    })
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    return {
      url: `/uploads/${file.filename}`, // 👈 client chat CHỈ CẦN DÒNG NÀY
    };
  }
}
