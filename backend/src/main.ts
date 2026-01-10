import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Enable CORS for frontend connection
    // Using 'true' allows any origin, which is needed for Ngrok tunneling
    app.enableCors({
        origin: true,
        methods: ['GET', 'POST'],
        credentials: true,
    });

    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`🚀 EcoConnect Backend running on http://localhost:${port}`);
}
bootstrap();
