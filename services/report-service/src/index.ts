import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { reportRouter } from './routes/report.routes';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 4005;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'report-service', timestamp: new Date().toISOString() });
});

app.use('/v1/reports', reportRouter);

app.listen(PORT, () => {
  logger.info(`🚀 Report service running on port ${PORT}`);
});

export { app };
