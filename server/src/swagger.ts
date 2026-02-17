import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const getOptions = (): swaggerJsdoc.Options => ({
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Social Network REST API",
            version: "1.0.0",
            description: "A Social Network REST API with posts, comments, and user management",
            contact: {
                name: "Menachi",
                email: "developer@example.com",
            },
        },
        servers: [
            {
                url: process.env.BASE_URL || "http://localhost:4000",
                description: "Development server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "JWT authorization header using the Bearer scheme",
                },
            },
            schemas: {
                User: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        _id: {
                            type: "string",
                            description: "User unique identifier",
                            example: "507f1f77bcf86cd799439011",
                        },
                        email: {
                            type: "string",
                            format: "email",
                            description: "User email address",
                            example: "user@example.com",
                        },
                        password: {
                            type: "string",
                            minLength: 6,
                            description: "User password (hashed when stored)",
                            example: "password123",
                        },
                    },
                },
                LoginRequest: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        email: {
                            type: "string",
                            format: "email",
                            example: "user@example.com",
                        },
                        password: {
                            type: "string",
                            example: "password123",
                        },
                    },
                },
                RegisterRequest: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        email: {
                            type: "string",
                            format: "email",
                            example: "user@example.com",
                        },
                        password: {
                            type: "string",
                            minLength: 6,
                            example: "password123",
                        },
                    },
                },
                AuthResponse: {
                    type: "object",
                    properties: {
                        accessToken: {
                            type: "string",
                            description: "JWT access token",
                            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        },
                        refreshToken: {
                            type: "string",
                            description: "JWT refresh token",
                            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        },
                        user: {
                            $ref: "#/components/schemas/User",
                        },
                    },
                },
                RefreshTokenRequest: {
                    type: "object",
                    required: ["refreshToken"],
                    properties: {
                        refreshToken: {
                            type: "string",
                            description: "Valid refresh token",
                            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        },
                    },
                },
                Error: {
                    type: "object",
                    properties: {
                        message: {
                            type: "string",
                            description: "Error message",
                            example: "An error occurred",
                        },
                        status: {
                            type: "number",
                            description: "HTTP status code",
                            example: 400,
                        },
                    },
                },
                ValidationError: {
                    type: "object",
                    properties: {
                        message: {
                            type: "string",
                            example: "Validation failed",
                        },
                        errors: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    field: {
                                        type: "string",
                                        example: "email",
                                    },
                                    message: {
                                        type: "string",
                                        example: "Invalid email format",
                                    },
                                },
                            },
                        },
                    },
                },
                Post: {
                    type: "object",
                    required: ["content", "owner"],
                    properties: {
                        _id: {
                            type: "string",
                            description: "Post unique identifier",
                            example: "507f1f77bcf86cd799439011",
                        },
                        content: {
                            type: "string",
                            description: "Post content",
                            example: "This is my first post!",
                        },
                        image: {
                            type: "string",
                            description: "URL to post image",
                            example: "/public/uploads/1234567890.jpg",
                        },
                        owner: {
                            type: "object",
                            properties: {
                                _id: { type: "string" },
                                name: { type: "string" },
                                email: { type: "string" },
                                profileImage: { type: "string" },
                            },
                        },
                        likesCount: {
                            type: "number",
                            description: "Number of likes",
                            example: 42,
                        },
                        commentsCount: {
                            type: "number",
                            description: "Number of comments",
                            example: 5,
                        },
                        isLiked: {
                            type: "boolean",
                            description: "Whether current user liked this post",
                            example: false,
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                        },
                        updatedAt: {
                            type: "string",
                            format: "date-time",
                        },
                    },
                },
                Comment: {
                    type: "object",
                    required: ["content", "postId", "owner"],
                    properties: {
                        _id: {
                            type: "string",
                            description: "Comment unique identifier",
                        },
                        content: {
                            type: "string",
                            description: "Comment content",
                            example: "Great post!",
                        },
                        postId: {
                            type: "string",
                            description: "ID of the post this comment belongs to",
                        },
                        owner: {
                            type: "object",
                            properties: {
                                _id: { type: "string" },
                                name: { type: "string" },
                                email: { type: "string" },
                                profileImage: { type: "string" },
                            },
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                        },
                        updatedAt: {
                            type: "string",
                            format: "date-time",
                        },
                    },
                },
                UserProfile: {
                    type: "object",
                    properties: {
                        _id: {
                            type: "string",
                            description: "User unique identifier",
                        },
                        email: {
                            type: "string",
                            format: "email",
                            description: "User email address",
                        },
                        name: {
                            type: "string",
                            description: "User display name",
                        },
                        profileImage: {
                            type: "string",
                            description: "URL to profile image",
                        },
                        postsCount: {
                            type: "number",
                            description: "Number of posts by this user",
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                        },
                    },
                },
                Pagination: {
                    type: "object",
                    properties: {
                        page: {
                            type: "integer",
                            description: "Current page number",
                        },
                        limit: {
                            type: "integer",
                            description: "Items per page",
                        },
                        total: {
                            type: "integer",
                            description: "Total number of items",
                        },
                        pages: {
                            type: "integer",
                            description: "Total number of pages",
                        },
                        hasMore: {
                            type: "boolean",
                            description: "Whether there are more pages",
                        },
                    },
                },
            },
            responses: {
                UnauthorizedError: {
                    description: "Access token is missing or invalid",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/Error",
                            },
                            example: {
                                message: "Unauthorized: Invalid or missing token",
                                status: 401,
                            },
                        },
                    },
                },
                NotFoundError: {
                    description: "The specified resource was not found",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/Error",
                            },
                            example: {
                                message: "Resource not found",
                                status: 404,
                            },
                        },
                    },
                },
                ForbiddenError: {
                    description: "Access to this resource is forbidden",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/Error",
                            },
                            example: {
                                message: "Forbidden - You don't have permission",
                                status: 403,
                            },
                        },
                    },
                },
                ValidationError: {
                    description: "Validation error",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ValidationError",
                            },
                        },
                    },
                },
                ServerError: {
                    description: "Internal server error",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/Error",
                            },
                            example: {
                                message: "Internal server error",
                                status: 500,
                            },
                        },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
        tags: [
            { name: "Authentication", description: "User authentication endpoints" },
            { name: "Users", description: "User profile management" },
            { name: "Posts", description: "Post CRUD operations" },
            { name: "Comments", description: "Comment operations" },
            { name: "AI", description: "AI-powered features" },
            { name: "Upload", description: "File upload endpoints" },
        ],
    },
    apis: [
        "./src/routes/*.ts",
        "./src/controllers/*.ts",
        "./dist/src/routes/*.js",
        "./dist/src/controllers/*.js",
    ],
});

const getSwaggerSpecs = () => swaggerJsdoc(getOptions());

export { getSwaggerSpecs, swaggerUi };
