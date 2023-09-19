import { Body, Controller, Post } from '@nestjs/common';
import { RecorderDto } from './dto/recorder.dto';
import { ApiBody } from '@nestjs/swagger';
import { RecorderService } from './recorder.service';
import { ClipperService } from 'src/clipper/clipper.service';
import axios from 'axios';
import * as fs from 'fs';
import { CloudflareService } from 'src/cloudflare/cloudflare.service';

@Controller('recorder')
export class RecorderController {
  constructor(
    private readonly recorderService: RecorderService,
    private readonly clipperService: ClipperService,
    private readonly cloudflareService: CloudflareService,
  ) {}

  @Post('')
  @ApiBody({
    type: RecorderDto,
  })
  async postRecorder(@Body() data: RecorderDto) {
    // 1. get m3u8
    const m3u8 = await this.clipperService.getM3u8(data.user_id);

    // 2. save it to stream table
    const randomString = Math.random().toString(36).substr(2, 11);
    await this.recorderService.createStream(randomString, 'title', 0, 'test');

    this.recorderJob(m3u8, randomString);

    return m3u8;
  }

  async recorderJob(m3u8, streamId: string) {
    // const urlSet = new Set();
    const urlList = [];

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

      // tsUrls에는 있지만 urlList에는 없는 ts url만 추출
      // const newTsUrls = tsUrls.filter((url) => {
      //   return !urlSet.has(url);
      // });
      const newTsUrls = tsUrls.filter((url) => {
        return !urlList.includes(url);
      });

      // save ts urls to set
      tsUrls.forEach((url) => {
        // urlSet.add(url);
        urlList.push(url);
      });

      // 이제 newTsUrls에 있는 영상을 다운로드 받아야 함
      // 2-2. get ts files to stream
      newTsUrls.forEach(async (url) => {
        // const fileName = url.split('/').pop();
        const randomAlphabetsAndNumbersTwentyLetters = Math.random()
          .toString(36)
          .substr(2, 20);
        const fileName = `${randomAlphabetsAndNumbersTwentyLetters}.ts`;
        // const fileName = `${count}.ts`;
        const filePath = `${streamId}/${fileName}`;
        const localPath = `temp/${fileName}`;

        // download ts file
        const response = await axios.get(url, { responseType: 'stream' });

        // const fileStream = fs.createWriteStream(localPath);

        await response.data.pipe(fileStream);

        fileStream.on('error', (err) => {
          console.error(`Error writing to file ${localPath}: ${err}`);
        });

        fileStream.on('finish', () => {
          console.log(`File saved to ${localPath}`);
        });

        // save response stream to s3
        try {
          const uploadResult =
            await this.cloudflareService.uploadFileFromBuffer(
              'yudarlinn-assets',
              filePath,
              fs.createReadStream(localPath),
              // 'video/mp2t',
              'application/octet-stream',
            );
          // .then(() => {
          //   fs.unlinkSync(localPath);
          // });

          console.log(uploadResult);
        } catch (e) {
          console.error(e);
        }

        // save data to database
        const segmentUrl = `https://yudarlinn-assets.leaven.team/${filePath}`;

        // const duration =
        //   await this.recorderService.getTsSegmentLength(segmentUrl);

        await this.recorderService.createSegment(
          streamId,
          fileName,
          2,
          count++,
          segmentUrl,
        );

        // delete local file

        // const fileStream = fs.createWriteStream(filePath);
        // response.data.pipe(fileStream);

        // fileStream.on('error', (err) => {
        //   console.error(`Error writing to file ${filePath}: ${err}`);
        // });

        // fileStream.on('finish', () => {
        //   console.log(`File saved to ${filePath}`);
        // });
      });
      // 2-3. upload ts stream to s3 (this is beta, so save it to local)
      // 2-4. save it to db

      console.log('sleep 5 seconds');
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}
