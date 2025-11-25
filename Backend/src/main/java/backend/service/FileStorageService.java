package backend.service;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path uploadDir = Paths.get("/home/veer/Documents/Java/Scoobydoo/Backend/uploads");
    private final String baseUrl = "http://192.168.0.177:8001/BACKEND/uploads/";

    public FileStorageService() throws IOException {
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }
    }

    public String store(MultipartFile file, String studentId) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        if (!file.getContentType().startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("File too large (max 5MB)");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        String ext = "";
        int dot = originalFilename.lastIndexOf('.');
        if (dot > -1) {
            ext = originalFilename.substring(dot);
        }
        String safeId = studentId != null && !studentId.isBlank() ? studentId : UUID.randomUUID().toString();
        String newName = safeId + ext;
        Path target = uploadDir.resolve(newName);

        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        return baseUrl + newName;
    }

    public String findExistingUrlById(String studentId) {
        if (studentId == null || studentId.isBlank()) return null;
        String[] exts = {".jpg", ".jpeg", ".png", ".webp"};
        for (String ext : exts) {
            Path candidate = uploadDir.resolve(studentId + ext);
            if (Files.exists(candidate)) {
                return baseUrl + studentId + ext;
            }
        }
        return null;
    }

    public String normalizeProfileUrl(String url, String studentId) {
        if (url == null || url.isBlank() || studentId == null || studentId.isBlank()) return url;
        try {
            String fileName = url.substring(url.lastIndexOf('/') + 1);
            if (fileName.startsWith(studentId)) {
                return url;
            }
            String ext = "";
            int dot = fileName.lastIndexOf('.');
            if (dot > -1) {
                ext = fileName.substring(dot);
            }
            String newName = studentId + ext;
            Path oldPath = uploadDir.resolve(fileName);
            Path newPath = uploadDir.resolve(newName);
            if (Files.exists(oldPath)) {
                Files.move(oldPath, newPath, StandardCopyOption.REPLACE_EXISTING);
                return baseUrl + newName;
            }
        } catch (Exception ignored) {
        }
        return url;
    }
}
