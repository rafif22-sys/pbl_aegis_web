<?php

namespace App\Swagger;

use OpenApi\Attributes as OA;

class ForgotPasswordSwagger
{
    #[OA\Post(
        path: "/api/auth/forgot-password",
        summary: "Kirim OTP ke email",
        description: "Step 1: Mengirimkan kode OTP 6 digit ke email user. Selalu mengembalikan response 200 meskipun email tidak terdaftar, untuk mencegah bocornya informasi email valid/tidak valid.",
        tags: ["Forgot Password"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["email"],
                properties: [
                    new OA\Property(
                        property: "email",
                        type: "string",
                        format: "email",
                        example: "petugas@aegis.com"
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "OTP dikirim (atau email tidak terdaftar, response tetap sama)",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: "message",
                            type: "string",
                            example: "Jika email terdaftar, kode OTP akan dikirimkan."
                        ),
                    ]
                )
            ),
            new OA\Response(response: 422, description: "Validasi gagal"),
        ]
    )]
    public function sendOtp() {}

    #[OA\Post(
        path: "/api/auth/verify-otp",
        summary: "Verifikasi kode OTP",
        description: "Step 2: Memverifikasi kode OTP yang dikirim ke email. OTP berlaku selama 10 menit. Jika valid, mengembalikan reset_token untuk digunakan di step berikutnya.",
        tags: ["Forgot Password"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["email", "otp"],
                properties: [
                    new OA\Property(
                        property: "email",
                        type: "string",
                        format: "email",
                        example: "petugas@aegis.com"
                    ),
                    new OA\Property(
                        property: "otp",
                        type: "string",
                        minLength: 6,
                        maxLength: 6,
                        example: "123456"
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "OTP valid",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "OTP valid."),
                        new OA\Property(
                            property: "reset_token",
                            type: "string",
                            description: "Token terenkripsi untuk digunakan di step reset password",
                            example: "eyJpdiI6Ik..."
                        ),
                    ]
                )
            ),
            new OA\Response(
                response: 422,
                description: "OTP tidak valid atau sudah kadaluarsa",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: "message",
                            type: "string",
                            example: "Kode OTP tidak valid."
                        ),
                    ]
                )
            ),
        ]
    )]
    public function verifyOtp() {}

    #[OA\Post(
        path: "/api/auth/reset-password",
        summary: "Reset password baru",
        description: "Step 3: Mengubah password user menggunakan reset_token dari step verifikasi OTP. Setelah berhasil, semua token aktif user akan dihapus (paksa login ulang di semua device).",
        tags: ["Forgot Password"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["reset_token", "password", "password_confirmation"],
                properties: [
                    new OA\Property(
                        property: "reset_token",
                        type: "string",
                        description: "Token dari response verify-otp",
                        example: "eyJpdiI6Ik..."
                    ),
                    new OA\Property(
                        property: "password",
                        type: "string",
                        format: "password",
                        minLength: 8,
                        example: "passwordbaru123"
                    ),
                    new OA\Property(
                        property: "password_confirmation",
                        type: "string",
                        format: "password",
                        minLength: 8,
                        example: "passwordbaru123"
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Password berhasil diperbarui",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: "message",
                            type: "string",
                            example: "Password berhasil diperbarui."
                        ),
                    ]
                )
            ),
            new OA\Response(
                response: 422,
                description: "Token tidak valid atau sudah kadaluarsa",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: "message",
                            type: "string",
                            example: "Token sudah kadaluarsa atau tidak valid."
                        ),
                    ]
                )
            ),
            new OA\Response(response: 404, description: "Pengguna tidak ditemukan"),
        ]
    )]
    public function resetPassword() {}
}