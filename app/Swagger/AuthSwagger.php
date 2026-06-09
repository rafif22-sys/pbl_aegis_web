<?php

namespace App\Swagger;

use OpenApi\Attributes as OA;

class AuthSwagger
{
    #[OA\Post(
        path: "/api/auth/login",
        summary: "Login user",
        description: "Login untuk petugas, supervisor, dan warga. Admin tidak bisa login via API ini.",
        tags: ["Auth"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["email", "password"],
                properties: [
                    new OA\Property(property: "email", type: "string", format: "email", example: "petugas@aegis.com"),
                    new OA\Property(property: "password", type: "string", format: "password", example: "password123"),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Login berhasil",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Login berhasil."),
                        new OA\Property(property: "token", type: "string", example: "55|ac8pAB1rl3GkCsis..."),
                        new OA\Property(
                            property: "user",
                            type: "object",
                            properties: [
                                new OA\Property(property: "id", type: "integer", example: 1),
                                new OA\Property(property: "nama", type: "string", example: "Budi Santoso"),
                                new OA\Property(property: "email", type: "string", example: "petugas@aegis.com"),
                                new OA\Property(property: "role", type: "string", enum: ["petugas", "supervisor", "warga"], example: "petugas"),
                                new OA\Property(property: "tanggal_lahir", type: "string", example: "1999-05-18"),
                                new OA\Property(property: "alamat", type: "string", example: "Jl. Merdeka No. 1"),
                                new OA\Property(property: "no_hp", type: "string", example: "08123456789"),
                                new OA\Property(property: "foto_profil", type: "string", nullable: true, example: "http://localhost:8000/foto_profil.jpg"),
                                new OA\Property(property: "tanggal_bergabung", type: "string", example: "2024-01-01"),
                                new OA\Property(property: "wilayah_pengawasan", type: "string", nullable: true, example: "Wilayah A"),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(
                response: 401,
                description: "Email atau password salah",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Email atau password salah."),
                    ]
                )
            ),
            new OA\Response(
                response: 403,
                description: "Akun tidak memiliki akses ke aplikasi mobile (role admin)",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Akun ini tidak memiliki akses ke aplikasi mobile."),
                    ]
                )
            ),
            new OA\Response(response: 422, description: "Validasi gagal"),
        ]
    )]
    public function login() {}

    #[OA\Get(
        path: "/api/auth/me",
        summary: "Get profil user yang sedang login",
        description: "Mengembalikan data profil user berdasarkan token yang digunakan.",
        tags: ["Auth"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "Berhasil",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: "user",
                            type: "object",
                            properties: [
                                new OA\Property(property: "id", type: "integer", example: 1),
                                new OA\Property(property: "nama", type: "string", example: "Budi Santoso"),
                                new OA\Property(property: "email", type: "string", example: "petugas@aegis.com"),
                                new OA\Property(property: "role", type: "string", example: "petugas"),
                                new OA\Property(property: "tanggal_lahir", type: "string", example: "1999-05-18"),
                                new OA\Property(property: "alamat", type: "string", example: "Jl. Merdeka No. 1"),
                                new OA\Property(property: "no_hp", type: "string", example: "08123456789"),
                                new OA\Property(property: "foto_profil", type: "string", nullable: true, example: "http://localhost:8000/foto_profil.jpg"),
                                new OA\Property(property: "tanggal_bergabung", type: "string", example: "2024-01-01"),
                                new OA\Property(property: "wilayah_pengawasan", type: "string", nullable: true, example: "Wilayah A"),
                                new OA\Property(
                                    property: "supervisor",
                                    type: "object",
                                    nullable: true,
                                    description: "Hanya ada jika role petugas dan memiliki supervisor",
                                    properties: [
                                        new OA\Property(property: "id", type: "integer", example: 2),
                                        new OA\Property(property: "nama", type: "string", example: "Supervisor A"),
                                    ]
                                ),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthorized"),
        ]
    )]
    public function me() {}

    #[OA\Post(
        path: "/api/auth/logout",
        summary: "Logout user",
        description: "Menghapus token yang sedang digunakan (logout dari device saat ini saja).",
        tags: ["Auth"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "Logout berhasil",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Logout berhasil."),
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthorized"),
        ]
    )]
    public function logout() {}

    #[OA\Post(
        path: "/api/auth/logout-all",
        summary: "Logout semua device",
        description: "Menghapus semua token user (logout dari semua device sekaligus).",
        tags: ["Auth"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "Semua sesi berhasil dihapus",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Semua sesi berhasil dihapus."),
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthorized"),
        ]
    )]
    public function logoutAll() {}
}