<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());

        $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'docx'];
        if (!in_array($extension, $allowedExtensions)) {
            return response()->json([
                'detail' => 'File type not allowed. Allowed: jpg, jpeg, png, webp, pdf, docx'
            ], 400);
        }

        $filename = Str::uuid() . '.' . $extension;
        
        // Store in public/uploads directory
        $path = $file->storeAs('uploads', $filename, 'public');
        
        $imageURL = 'https://apireviewx.code-xperts.com/apireviewx/storage/app/public/uploads/'.$filename;

        return response()->json([
            'file_url' => $imageURL,
            'filename' => $file->getClientOriginalName(),
        ]);
    }
}
