<?php

namespace App\Swagger;

use OpenApi\Attributes as OA;

class TamuSwagger
{
    #[OA\Get(
        path: "/api/tamu",
        summary: "Get semua data tamu",
        tags: ["Tamu"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Berhasil"),
            new OA\Response(response: 401, description: "Unauthorized"),
        ]
    )]
    public function index() {}

    #[OA\Post(
        path: "/api/tamu",
        summary: "Tambah data tamu baru",
        tags: ["Tamu"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 201, description: "Berhasil disimpan"),
            new OA\Response(response: 422, description: "Validasi gagal"),
        ]
    )]
    public function store() {}

    #[OA\Patch(
        path: "/api/tamu/{id}",
        summary: "Update status tamu",
        tags: ["Tamu"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(response: 200, description: "Berhasil diperbarui"),
            new OA\Response(response: 404, description: "Tidak ditemukan"),
        ]
    )]
    public function update() {}
}