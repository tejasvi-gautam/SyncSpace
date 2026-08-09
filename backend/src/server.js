import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
	res.json({ message: 'SyncSpace API is running' });
});

app.use((req, res) => {
	res.status(404).json({ message: 'Route not found' });
});

app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
