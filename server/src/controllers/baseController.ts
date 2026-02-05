import { Request, Response } from "express";

const errorMessage = (error: unknown) =>
    error instanceof Error ? error.message : "An unknown error occurred";

class BaseController {
    model: any;

    constructor(dataModel: any) {
        this.model = dataModel;
    }

    async get(req: Request, res: Response) {
        try {
            const data = await this.model.find(req.query || {});
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: errorMessage(error) });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const data = await this.model.findById(req.params.id);
            if (!data) {
                return res.status(404).json({ error: "Data not found" });
            }
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: errorMessage(error) });
        }
    }

    async post(req: Request, res: Response) {
        try {
            const data = await this.model.create(req.body);
            res.status(201).json(data);
        } catch (error) {
            res.status(500).json({ error: errorMessage(error) });
        }
    }

    async del(req: Request, res: Response) {
        try {
            const data = await this.model.findByIdAndDelete(req.params.id);
            res.send(data);
        } catch (error) {
            res.status(500).json({ error: errorMessage(error) });
        }
    }

    async put(req: Request, res: Response) {
        try {
            const data = await this.model.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: errorMessage(error) });
        }
    }
}

export default BaseController;