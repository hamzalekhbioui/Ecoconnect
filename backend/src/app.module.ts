import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CommonModule } from './common/common.module';
import { ChatModule } from './chat/chat.module';
import { CommunitiesModule } from './modules/communities/communities.module';
import { PostsModule } from './modules/posts/posts.module';
import { EventsModule } from './modules/events/events.module';
import { FriendshipsModule } from './modules/friendships/friendships.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { MessagesModule } from './modules/messages/messages.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { AdminModule } from './modules/admin/admin.module';
import { UploadModule } from './modules/upload/upload.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        ThrottlerModule.forRoot([
            {
                ttl: 60_000,
                limit: 30,
                getTracker: (req: Record<string, any>) => req.user?.id || req.ip || 'anonymous',
            },
        ]),
        CommonModule,
        ChatModule,
        CommunitiesModule,
        PostsModule,
        EventsModule,
        FriendshipsModule,
        ConversationsModule,
        MessagesModule,
        MarketplaceModule,
        AdminModule,
        UploadModule,
    ],
})
export class AppModule { }
