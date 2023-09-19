import { Module } from '@nestjs/common';
import { RecorderController } from './recorder.controller';
import { RecorderService } from './recorder.service';
import { ClipperModule } from 'src/clipper/clipper.module';
import { YudarlinnStream } from './entities/yudarlinn-stream.entity';
import { YudarlinnSegment } from './entities/yudarlinn-segment.entity';
import { SequelizeModule } from '@nestjs/sequelize';
import { CloudflareModule } from 'src/cloudflare/cloudflare.module';

@Module({
  imports: [
    ClipperModule,
    CloudflareModule,
    SequelizeModule.forFeature([YudarlinnSegment, YudarlinnStream]),
  ],
  controllers: [RecorderController],
  providers: [RecorderService],
})
export class RecorderModule {}
