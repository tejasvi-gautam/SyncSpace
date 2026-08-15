//generic function to deal with validation of request body using zod schema
export const validate=(schema) => {
    return (req, res, next) => {
        
            const result = schema.safeParse(req.body);
            if (!result.success) {
                const errors = result.error.issues.map((err) => err.message);
                return res.status(400).json({ errors });
            }
            req.body=result.data;
            next();
        
    };
};