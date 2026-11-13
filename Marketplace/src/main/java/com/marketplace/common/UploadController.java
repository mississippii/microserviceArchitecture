package com.marketplace.common;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

/**
 * Photos and videos a seller adds to a product. Saved under a random name, served from /uploads/.
 */
// ponytail: files live on this server's disk, as uploaded (no resizing, no content scan).
// Move to object storage (R2 / S3) with thumbnails before running more than one server.
@RestController
public class UploadController {

    /** The only types accepted; the saved file's extension (and so the type it is served as) comes from here, never from the client's file name. */
    private static final Map<String, String> TYPES = Map.of(
            "image/jpeg", "jpg", "image/png", "png", "image/webp", "webp", "video/mp4", "mp4", "video/webm", "webm");
    private static final long MAX_PHOTO = 10L << 20;
    private static final long MAX_VIDEO = 50L << 20; // also spring.servlet.multipart.max-file-size

    private final Path dir;

    UploadController(@Value("${app.uploads.dir}") String dir) {
        this.dir = Path.of(dir).toAbsolutePath();
    }

    @PostMapping("/api/uploads")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('SELLER')")
    public Map<String, String> upload(@RequestParam MultipartFile file) throws IOException {
        var ext = file.getContentType() == null ? null : TYPES.get(file.getContentType());
        if (ext == null) throw Errors.badRequest("upload a JPG, PNG or WebP photo, or an MP4 or WebM video");
        var video = file.getContentType().startsWith("video/");
        if (file.isEmpty() || file.getSize() > (video ? MAX_VIDEO : MAX_PHOTO)) {
            throw Errors.badRequest(video ? "a video can be up to 50 MB" : "a photo can be up to 10 MB");
        }
        Files.createDirectories(dir);
        var name = UUID.randomUUID() + "." + ext;
        file.transferTo(dir.resolve(name));
        return Map.of("url", "/uploads/" + name);
    }

    @Configuration
    static class Serve implements WebMvcConfigurer {
        private final String location;

        Serve(@Value("${app.uploads.dir}") String dir) {
            this.location = Path.of(dir).toAbsolutePath().toUri().toString();
        }

        @Override
        public void addResourceHandlers(ResourceHandlerRegistry registry) {
            registry.addResourceHandler("/uploads/**").addResourceLocations(location.endsWith("/") ? location : location + "/");
        }
    }
}
