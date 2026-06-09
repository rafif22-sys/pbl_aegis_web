<?php

namespace App\Swagger;

use OpenApi\Attributes as OA;

class JadwalSwagger
{
    #[OA\Get(
        path: "/api/petugas/jadwal/mingguan",
        summary: "Get jadwal mingguan petugas",
        description: "Mengambil jadwal dalam satu minggu berdasarkan tanggal yang diberikan. Jika tanggal tidak diisi, default ke hari ini.",
        tags: ["Jadwal"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "tanggal",
                in: "query",
                required: false,
                description: "Tanggal acuan untuk menentukan minggu (format: Y-m-d)",
                schema: new OA\Schema(type: "string", format: "date", example: "2026-05-18")
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Berhasil",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "status", type: "boolean", example: true),
                        new OA\Property(property: "minggu_mulai", type: "string", example: "2026-05-13"),
                        new OA\Property(property: "minggu_akhir", type: "string", example: "2026-05-19"),
                        new OA\Property(
                            property: "data",
                            type: "array",
                            items: new OA\Items(
                                properties: [
                                    new OA\Property(property: "id_jadwal_absensi", type: "integer", example: 1),
                                    new OA\Property(property: "tanggal", type: "string", example: "2026-05-18"),
                                    new OA\Property(property: "hari", type: "string", example: "Senin"),
                                    new OA\Property(property: "pos_jaga", type: "string", example: "Pos A"),
                                    new OA\Property(property: "jam_mulai", type: "string", example: "07:00"),
                                    new OA\Property(property: "jam_selesai", type: "string", example: "15:00"),
                                    new OA\Property(property: "nama_shift", type: "string", example: "Shift Pagi"),
                                    new OA\Property(property: "status", type: "string", example: "hadir"),
                                    new OA\Property(property: "jam_masuk", type: "string", example: "07:05"),
                                    new OA\Property(property: "jam_pulang", type: "string", example: "15:00"),
                                ]
                            )
                        ),
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthorized"),
            new OA\Response(response: 422, description: "Validasi gagal"),
        ]
    )]
    public function mingguan() {}

    #[OA\Get(
        path: "/api/petugas/jadwal/absensi",
        summary: "Get riwayat absensi petugas",
        description: "Mengambil riwayat absensi petugas dengan filter tanggal dan status. Data dipaginasi 15 per halaman.",
        tags: ["Jadwal"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "tanggal",
                in: "query",
                required: false,
                description: "Filter berdasarkan tanggal (format: Y-m-d)",
                schema: new OA\Schema(type: "string", format: "date", example: "2026-05-18")
            ),
            new OA\Parameter(
                name: "status",
                in: "query",
                required: false,
                description: "Filter berdasarkan status absensi",
                schema: new OA\Schema(
                    type: "string",
                    enum: ["menunggu", "hadir", "terlambat", "alpha", "libur"],
                    example: "hadir"
                )
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Berhasil",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "status", type: "boolean", example: true),
                        new OA\Property(
                            property: "data",
                            type: "object",
                            properties: [
                                new OA\Property(property: "current_page", type: "integer", example: 1),
                                new OA\Property(property: "per_page", type: "integer", example: 15),
                                new OA\Property(property: "total", type: "integer", example: 30),
                                new OA\Property(
                                    property: "data",
                                    type: "array",
                                    items: new OA\Items(
                                        properties: [
                                            new OA\Property(property: "id_jadwal_absensi", type: "integer", example: 1),
                                            new OA\Property(property: "tanggal", type: "string", example: "2026-05-18"),
                                            new OA\Property(property: "hari", type: "string", example: "Senin"),
                                            new OA\Property(property: "pos_jaga", type: "string", example: "Pos A"),
                                            new OA\Property(property: "jam_mulai", type: "string", example: "07:00"),
                                            new OA\Property(property: "jam_selesai", type: "string", example: "15:00"),
                                            new OA\Property(property: "nama_shift", type: "string", example: "Shift Pagi"),
                                            new OA\Property(property: "status", type: "string", example: "hadir"),
                                            new OA\Property(property: "jam_masuk", type: "string", example: "07:05"),
                                            new OA\Property(property: "jam_pulang", type: "string", example: "15:00"),
                                        ]
                                    )
                                ),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthorized"),
            new OA\Response(response: 422, description: "Validasi gagal"),
        ]
    )]
    public function riwayatAbsensi() {}

    // #[OA\Get(
    //     path: "/api/petugas/jadwal/absensi/{id}",
    //     summary: "Get detail absensi petugas",
    //     description: "Mengambil detail absensi berdasarkan ID termasuk foto masuk, foto pulang, lokasi, dan rute.",
    //     tags: ["Jadwal"],
    //     security: [["bearerAuth" => []]],
    //     parameters: [
    //         new OA\Parameter(
    //             name: "id",
    //             in: "path",
    //             required: true,
    //             description: "ID jadwal absensi",
    //             schema: new OA\Schema(type: "integer", example: 1)
    //         )
    //     ],
    //     responses: [
    //         new OA\Response(
    //             response: 200,
    //             description: "Berhasil",
    //             content: new OA\JsonContent(
    //                 properties: [
    //                     new OA\Property(property: "status", type: "boolean", example: true),
    //                     new OA\Property(
    //                         property: "data",
    //                         type: "object",
    //                         properties: [
    //                             new OA\Property(property: "id_jadwal_absensi", type: "integer", example: 1),
    //                             new OA\Property(property: "tanggal", type: "string", example: "2026-05-18"),
    //                             new OA\Property(property: "hari", type: "string", example: "Senin"),
    //                             new OA\Property(property: "pos_jaga", type: "string", example: "Pos A"),
    //                             new OA\Property(property: "alamat_pos", type: "string", example: "Jl. Merdeka No. 1"),
    //                             new OA\Property(property: "jam_mulai", type: "string", example: "07:00"),
    //                             new OA\Property(property: "jam_selesai", type: "string", example: "15:00"),
    //                             new OA\Property(property: "nama_shift", type: "string", example: "Shift Pagi"),
    //                             new OA\Property(property: "status", type: "string", example: "hadir"),
    //                             new OA\Property(property: "jam_masuk", type: "string", example: "07:05"),
    //                             new OA\Property(property: "jam_pulang", type: "string", example: "15:00"),
    //                             new OA\Property(property: "foto_masuk", type: "string", example: "https://supabase.io/foto_masuk.jpg"),
    //                             new OA\Property(property: "foto_pulang", type: "string", example: "https://supabase.io/foto_pulang.jpg"),
    //                             new OA\Property(property: "latitude", type: "number", format: "float", example: -6.9667),
    //                             new OA\Property(property: "longitude", type: "number", format: "float", example: 110.4167),
    //                             new OA\Property(property: "rute", type: "string", example: "Rute A"),
    //                         ]
    //                     ),
    //                 ]
    //             )
    //         ),
    //         new OA\Response(response: 401, description: "Unauthorized"),
    //         new OA\Response(response: 404, description: "Data tidak ditemukan"),
    //     ]
    // )]
    // public function showAbsensi() {}
}