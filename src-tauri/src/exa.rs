use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExaResult {
    pub id: String,
    pub url: String,
    pub title: Option<String>,
    pub score: Option<f64>,
    #[serde(rename = "publishedDate")]
    pub published_date: Option<String>,
    pub author: Option<String>,
    pub highlights: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExaResponse {
    pub results: Vec<ExaResult>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchRequest {
    pub query: String,
    pub phase: u8,
    pub category: Option<String>,
}

fn get_api_key() -> Result<String, String> {
    let _ = dotenvy::dotenv();
    std::env::var("EXA_API_KEY").map_err(|_| "EXA_API_KEY not set in .env".to_string())
}

#[tauri::command]
pub async fn exa_search(request: SearchRequest) -> Result<Vec<ExaResult>, String> {
    let api_key = get_api_key()?;
    let client = Client::new();

    let mut body = serde_json::json!({
        "query": request.query,
        "numResults": 10,
        "type": "neural",
        "highlights": {
            "numSentences": 3,
            "highlightsPerUrl": 2
        }
    });

    if let Some(cat) = &request.category {
        body["category"] = serde_json::Value::String(cat.clone());
    }

    let res = client
        .post("https://api.exa.ai/search")
        .header("x-api-key", &api_key)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !res.status().is_success() {
        let status = res.status();
        let text = res.text().await.unwrap_or_default();
        return Err(format!("Exa API error {}: {}", status, text));
    }

    let exa_response: ExaResponse = res
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    Ok(exa_response.results)
}

#[tauri::command]
pub async fn exa_crawl(url: String) -> Result<String, String> {
    let api_key = get_api_key()?;
    let client = Client::new();

    let body = serde_json::json!({
        "ids": [url],
        "text": {
            "maxCharacters": 3000
        }
    });

    let res = client
        .post("https://api.exa.ai/contents")
        .header("x-api-key", &api_key)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Crawl request failed: {}", e))?;

    if !res.status().is_success() {
        let status = res.status();
        let text = res.text().await.unwrap_or_default();
        return Err(format!("Exa crawl error {}: {}", status, text));
    }

    res.text()
        .await
        .map_err(|e| format!("Failed to read crawl response: {}", e))
}
