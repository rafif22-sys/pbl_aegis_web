<?php

namespace App\Swagger;

use OpenApi\Attributes as OA;

class SosSwagger
{
    #[OA\Post(
        path: "/api/sos",
        summary: "Kirim SOS baru",
        description: "Dapat diakses oleh petugas, supervisor, dan warga.",
        tags: ["SOS"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["latitude", "longitude", "jenis_keadaan"],
                properties: [
                    new OA\Property(property: "latitude", type: "number", format: "float", example: -6.9667),
                    new OA\Property(property: "longitude", type: "number", format: "float", example: 110.4167),
                    new OA\Property(
                        property: "jenis_keadaan",
                        type: "string",
                        enum: ["kebakaran", "pencurian", "hewan liar", "bencana alam", "lainnya"],
                        example: "kebakaran"
                    ),
                    new OA\Property(property: "deskripsi", type: "string", nullable: true, example: "Ada kebakaran di gedung A"),
                    new OA\Property(property: "bantuan_warga", type: "boolean", nullable: true, example: false),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "SOS berhasil dikirim",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "message", type: "string", example: "SOS berhasil dikirim."),
                        new OA\Property(property: "data", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthorized"),
            new OA\Response(response: 422, description: "Validasi gagal"),
        ]
    )]
    public function store() {}

    #[OA\Patch(
        path: "/api/petugas/sos/{id}",
        summary: "Update status SOS oleh petugas",
        description: "Hanya dapat diakses oleh petugas. Jika status selesai, petugas harus berada dalam radius 30 meter dari lokasi kejadian.",
        tags: ["SOS"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "ID SOS",
                schema: new OA\Schema(type: "integer", example: 1)
            )
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(
                        property: "status",
                        type: "string",
                        enum: ["menunggu bantuan", "selesai"],
                        example: "selesai"
                    ),
                    new OA\Property(property: "bantuan_warga", type: "boolean", nullable: true, example: false),
                    // new OA\Property(property: "deskripsi", type: "string", nullable: true, example: "Situasi sudah terkendali"),
                    new OA\Property(property: "latitude_petugas", type: "number", format: "float", example: -6.9667),
                    new OA\Property(property: "longitude_petugas", type: "number", format: "float", example: 110.4167),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Data SOS berhasil diperbarui"),
            new OA\Response(response: 401, description: "Unauthorized"),
            new OA\Response(response: 404, description: "Data SOS tidak ditemukan"),
            new OA\Response(
                response: 422,
                description: "Validasi gagal atau petugas terlalu jauh dari lokasi",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: false),
                        new OA\Property(property: "message", type: "string", example: "Anda harus berada di lokasi kejadian untuk mengkonfirmasi SOS."),
                        new OA\Property(
                            property: "data",
                            type: "object",
                            properties: [
                                new OA\Property(property: "jarak_meter", type: "integer", example: 150),
                                new OA\Property(property: "batas_meter", type: "integer", example: 30),
                            ]
                        ),
                    ]
                )
            ),
        ]
    )]
    public function updatePetugas() {}

    #[OA\Patch(
        path: "/api/supervisor/sos/{id}",
        summary: "Update status SOS oleh supervisor",
        description: "Hanya dapat diakses oleh supervisor.",
        tags: ["SOS"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "ID SOS",
                schema: new OA\Schema(type: "integer", example: 1)
            )
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(
                        property: "status",
                        type: "string",
                        enum: ["menunggu bantuan", "selesai"],
                        example: "selesai"
                    ),
                    new OA\Property(property: "bantuan_warga", type: "boolean", nullable: true, example: false),
                    // new OA\Property(property: "deskripsi", type: "string", nullable: true, example: "Situasi sudah terkendali"),
                    new OA\Property(property: "latitude_petugas", type: "number", format: "float", example: -6.9667),
                    new OA\Property(property: "longitude_petugas", type: "number", format: "float", example: 110.4167),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Data SOS berhasil diperbarui"),
            new OA\Response(response: 401, description: "Unauthorized"),
            new OA\Response(response: 404, description: "Data SOS tidak ditemukan"),
            new OA\Response(response: 422, description: "Validasi gagal atau petugas terlalu jauh dari lokasi"),
        ]
    )]
    public function updateSupervisor() {}

    #[OA\Get(
        path: "/api/sos/{id}",
        summary: "Get detail SOS",
        description: "Dapat diakses oleh petugas, supervisor, dan warga.",
        tags: ["SOS"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "ID SOS",
                schema: new OA\Schema(type: "integer", example: 1)
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Berhasil",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "data", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthorized"),
            new OA\Response(response: 404, description: "Data SOS tidak ditemukan"),
        ]
    )]
    public function show() {}

    #[OA\Get(
        path: "/api/sos",
        summary: "Get semua data SOS",
        description: "Dapat diakses oleh petugas, supervisor, dan warga. Bisa difilter berdasarkan status.",
        tags: ["SOS"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "status",
                in: "query",
                required: false,
                description: "Filter berdasarkan status SOS",
                schema: new OA\Schema(
                    type: "string",
                    enum: ["menunggu bantuan", "selesai"],
                    example: "menunggu bantuan"
                )
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Berhasil",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "data", type: "array", items: new OA\Items(type: "object")),
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthorized"),
        ]
    )]
    public function index() {}
}