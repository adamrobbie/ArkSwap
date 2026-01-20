import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './database/database.module';
import { BitcoinService } from './bitcoin.service';

@Controller('watch')
export class WatchController {
    constructor(
        private readonly prisma: PrismaService,
        private readonly bitcoinService: BitcoinService,
    ) { }

    @Get('stats')
    async getStats() {
        const lastScannedBlock = await this.prisma.scannedBlock.findFirst({
            orderBy: { height: 'desc' },
        });

        const scannedHeight = lastScannedBlock?.height ?? 0;
        const chainTip = await this.bitcoinService.getBlockCount();

        return {
            scannedHeight,
            chainTip,
            syncProgress: chainTip > 0 ? (scannedHeight / chainTip) * 100 : 0,
        };
    }

    @Get('blocks')
    async getBlocks() {
        // Return the last 20 scanned blocks
        return this.prisma.scannedBlock.findMany({
            orderBy: { height: 'desc' },
            take: 20,
        });
    }

    @Get('rounds')
    async getRounds() {
        // Return details about Ark Rounds found
        return this.prisma.arkRound.findMany({
            orderBy: { blockHeight: 'desc' },
            take: 50,
        })
    }
}
