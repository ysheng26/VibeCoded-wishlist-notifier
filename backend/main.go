package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"gopkg.in/gomail.v2"
)

type NotifyRequest struct {
	RecipientEmail string `json:"recipientEmail"`
	ProductName    string `json:"productName"`
	ProductPrice   string `json:"productPrice"`
	ProductURL     string `json:"productUrl"`
	StoreName      string `json:"storeName"`
	ImageURL       string `json:"imageUrl"`
	SenderName     string `json:"senderName"`
}

var (
	smtpHost    = "smtp.gmail.com"
	smtpPort    = 587
	senderEmail string
	senderPass  string
)

func main() {
	senderEmail = os.Getenv("SENDER_EMAIL")
	senderPass = os.Getenv("SENDER_PASSWORD")

	if senderEmail == "" || senderPass == "" {
		log.Fatal("Please set SENDER_EMAIL and SENDER_PASSWORD environment variables")
	}

	http.HandleFunc("/api/notify", corsMiddleware(stupidPassword(handleNotify)))
	http.HandleFunc("/health", handleHealth)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func stupidPassword(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		stupidPassword := r.Header.Get("x-yoyoyo")
		if stupidPassword != os.Getenv("STUPID_PASSWORD") {
			w.WriteHeader(http.StatusForbidden)
			return
		}
		next(w, r)
	}
}

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type,x-yoyoyo")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
}

func handleNotify(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req NotifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.RecipientEmail == "" || req.ProductName == "" || req.StoreName == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	if err := sendEmail(req); err != nil {
		log.Printf("Error sending email: %v", err)
		http.Error(w, "Failed to send email", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func sendEmail(req NotifyRequest) error {
	log.Printf("sendEmail %+v\n", req)
	m := gomail.NewMessage()
	m.SetHeader("From", senderEmail)
	m.SetHeader("To", req.RecipientEmail)

	subject := "Someone is thinking of you 💝"
	m.SetHeader("Subject", subject)

	htmlBody := generateEmailHTML(req)
	m.SetBody("text/html", htmlBody)

	d := gomail.NewDialer(smtpHost, smtpPort, senderEmail, senderPass)
	return d.DialAndSend(m)
}

func generateEmailHTML(req NotifyRequest) string {
	senderName := req.SenderName
	if senderName == "" {
		senderName = "Someone special"
	}

	return fmt.Sprintf(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>A Little Hint</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%%; border-collapse: collapse; background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" style="max-width: 600px; width: 100%%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center;">
                            <h1 style="margin: 0; font-size: 28px; color: #2c3e50; font-weight: 600;">A Little Hint 💝</h1>
                            <p style="margin: 12px 0 0; font-size: 16px; color: #7f8c8d; line-height: 1.5;">
                                %s has been browsing and found something they'd love
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 40px;">
                            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center;">
                                <img src="%s" alt="Product" style="max-width: 100%%; height: auto; border-radius: 6px; display: block; margin: 0 auto;" />
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 40px;">
                            <table role="presentation" style="width: 100%%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #ecf0f1;">
                                        <span style="font-size: 14px; color: #95a5a6; display: block; margin-bottom: 4px;">Product</span>
                                        <span style="font-size: 16px; color: #2c3e50; font-weight: 500;">%s</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #ecf0f1;">
                                        <span style="font-size: 14px; color: #95a5a6; display: block; margin-bottom: 4px;">Price</span>
                                        <span style="font-size: 20px; color: #27ae60; font-weight: 600;">%s</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0;">
                                        <span style="font-size: 14px; color: #95a5a6; display: block; margin-bottom: 4px;">Store</span>
                                        <span style="font-size: 16px; color: #2c3e50; font-weight: 500;">%s</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 40px 40px; text-align: center;">
                            <a href="%s" style="display: inline-block; padding: 14px 32px; background-color: #3498db; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500;">
                                View Product
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 12px 12px; text-align: center;">
                            <p style="margin: 0; font-size: 13px; color: #95a5a6; line-height: 1.6;">
                                This is a gentle hint from someone who cares about you.<br/>
                                Sent on %s
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
	`, senderName, req.ImageURL, req.ProductName, req.ProductPrice, req.StoreName, req.ProductURL, time.Now().Format("January 2, 2006"))
}
