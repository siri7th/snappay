"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const express_validator_1 = require("express-validator");
const validate = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map((err) => {
            const field = err.path || err.param || 'unknown';
            return {
                field,
                message: err.msg,
            };
        });
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: formattedErrors,
        });
    }
    return next();
};
exports.validate = validate;
//# sourceMappingURL=validation.js.map