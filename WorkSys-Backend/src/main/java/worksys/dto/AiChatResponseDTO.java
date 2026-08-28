package worksys.dto;

public class AiChatResponseDTO {
    private String response;

    public AiChatResponseDTO(String response) {
        this.response = response;
    }

    public String getResponse() {
        return response;
    }

    public void setResponse(String response) {
        this.response = response;
    }
}
