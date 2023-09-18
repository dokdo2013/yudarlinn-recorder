import { Module } from '@nestjs/common';
import { RecorderController } from './recorder.controller';
import { RecorderService } from './recorder.service';
import { ClipperModule } from 'src/clipper/clipper.module';

@Module({
  imports: [ClipperModule],
  controllers: [RecorderController],
  providers: [RecorderService],
})
export class RecorderModule {}
