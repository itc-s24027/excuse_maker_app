import express from "express";
import cors from "cors";
import test from "./routes/test.ts";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/test", test);

const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Backend running on port ${port}`);
});

export default app