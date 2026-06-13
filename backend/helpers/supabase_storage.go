// helpers/supabase_storage.go
package helpers

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// GANTI DENGAN KREDENSIAL SUPABASE-MU
const SupabaseURL = "https://eiidozttwfikrvysekox.supabase.co"
const SupabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpaWRvenR0d2Zpa3J2eXNla294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjYxNjIsImV4cCI6MjA5NDQ0MjE2Mn0.bCJCH6a8askigq35DYL2iw5ZloBsOTjmmHLw0g3s8ZY"
const BucketName = "attendance-photos" //

func UploadBase64ToSupabase(base64Image string, employeeID uint) (string, error) {
	// 1. Bersihkan prefix Base64 (contoh: "data:image/jpeg;base64,")
	b64data := base64Image
	commaIdx := strings.Index(b64data, ",")
	if commaIdx != -1 {
		b64data = b64data[commaIdx+1:]
	}

	// 2. Decode string Base64 menjadi byte array
	decoded, err := base64.StdEncoding.DecodeString(b64data)
	if err != nil {
		return "", fmt.Errorf("gagal mendecode base64: %v", err)
	}

	// 3. Buat nama file unik
	fileName := fmt.Sprintf("emp_%d_%d.jpg", employeeID, time.Now().Unix())

	// 4. Susun URL API Supabase Storage
	url := fmt.Sprintf("%s/storage/v1/object/%s/%s", SupabaseURL, BucketName, fileName)

	// 5. Buat HTTP Request
	req, err := http.NewRequest("POST", url, bytes.NewReader(decoded))
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "Bearer "+SupabaseKey)
	req.Header.Set("apikey", SupabaseKey)
	req.Header.Set("Content-Type", "image/jpeg")

	// 6. Eksekusi Request
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("supabase upload error: %s (status: %d)", string(bodyBytes), resp.StatusCode)
	}

	// 7. Kembalikan URL Publik file tersebut
	publicURL := fmt.Sprintf("%s/storage/v1/object/public/%s/%s", SupabaseURL, BucketName, fileName)
	return publicURL, nil
}
