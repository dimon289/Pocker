import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "142.93.175.150",
    port:   5432,
    username: "postgres",
    password: "BobaAboba",
    database: "Pocker",
  entities: ["output/entities/*.ts"], // Ваші Entity
  migrations: ['src/migrations/*.ts'], // Шлях до міграцій
  synchronize: false, // Не синхронізуємо базу при кожному запуску
});