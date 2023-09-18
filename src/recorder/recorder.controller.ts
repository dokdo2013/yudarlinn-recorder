import { Body, Controller, Post } from '@nestjs/common';
import { RecorderDto } from './dto/recorder.dto';
import { ApiBody } from '@nestjs/swagger';
import { RecorderService } from './recorder.service';
import { ClipperService } from 'src/clipper/clipper.service';
import axios from 'axios';
import * as fs from 'fs';

@Controller('recorder')
export class RecorderController {
  constructor(
    private readonly recorderService: RecorderService,
    private readonly clipperService: ClipperService,
  ) {}

  @Post('')
  @ApiBody({
    type: RecorderDto,
  })
  async postRecorder(@Body() data: RecorderDto) {
    // 1. get m3u8
    const m3u8 = await this.clipperService.getM3u8(data.user_id);

    this.recorderJob(m3u8);

    return m3u8;
  }

  async recorderJob(m3u8) {
    const urlSet = new Set();

    // 2. start a loop
    let count = 0;
    while (true) {
      // 2-1. get ts urls
      const m3u8Data = await this.clipperService.getM3u8Data(m3u8[0].url);
      const tsUrls = await this.clipperService.getTsUrls(m3u8Data);

      // [escape condition] if there are no ts urls, break
      if (tsUrls.length === 0) {
        break;
      }

      // tsUrls에는 있지만 urlSet에는 없는 ts url만 추출
      const newTsUrls = tsUrls.filter((url) => {
        return !urlSet.has(url);
      });

      // save ts urls to set
      tsUrls.forEach((url) => {
        urlSet.add(url);
      });

      // 이제 newTsUrls에 있는 영상을 다운로드 받아야 함
      // 2-2. get ts files to stream
      newTsUrls.forEach(async (url) => {
        const fileName = `${count++}.ts`;
        const filePath = `temp/${fileName}`;

        // download ts file (url) to local
        const response = await axios.get(url, { responseType: 'stream' });

        const fileStream = fs.createWriteStream(filePath);
        response.data.pipe(fileStream);

        fileStream.on('error', (err) => {
          console.error(`Error writing to file ${filePath}: ${err}`);
        });

        fileStream.on('finish', () => {
          console.log(`File saved to ${filePath}`);
        });
      });

      // 2-3. upload ts stream to s3 (this is beta, so save it to local)
      // 2-4. save it to db

      console.log('sleep 5 seconds');
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}
