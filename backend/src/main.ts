import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Enable CORS for frontend connection
    app.enableCors({
        origin: true,
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
    });

    // Global validation pipe for DTO validation
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, // Strip properties not in DTO
            forbidNonWhitelisted: true, // Throw error for unknown properties
            transform: true, // Auto-transform payloads to DTO instances
            transformOptions: {
                enableImplicitConversion: true, // Convert query params to proper types
            },
        }),
    );

    // Swagger API documentation setup
    const config = new DocumentBuilder()
        .setTitle('EcoConnect API')
        .setDescription('Backend API for EcoConnect platform')
        .setVersion('1.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Enter Supabase JWT token',
            },
            'JWT-auth',
        )
        .addTag('communities', 'Community management endpoints')
        .addTag('posts', 'Post and comment endpoints')
        .addTag('events', 'Community event endpoints')
        .addTag('friendships', 'Friendship management endpoints')
        .addTag('conversations', 'Conversation endpoints')
        .addTag('messages', 'Message endpoints')
        .addTag('marketplace', 'Marketplace listing endpoints')
        .addTag('admin', 'Admin-only endpoints')
        .addTag('upload', 'File upload endpoints')
        .addTag('chat', 'AI Chat endpoints')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });

    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`🚀 EcoConnect Backend running on http://localhost:${port}`);
    console.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
}
bootstrap();
