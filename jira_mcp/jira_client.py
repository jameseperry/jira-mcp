from __future__ import annotations

import os
from base64 import b64encode

import httpx


class JiraInstance:
    def __init__(self, base_url: str, email: str, api_token: str) -> None:
        self._base_url = base_url.rstrip("/") + "/rest"
        credentials = b64encode(f"{email}:{api_token}".encode()).decode()
        self._headers = {
            "Authorization": f"Basic {credentials}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        self._client = httpx.AsyncClient(headers=self._headers, timeout=30)

    async def _request(self, method: str, path: str, json: dict | None = None) -> dict | None:
        url = f"{self._base_url}{path}"
        response = await self._client.request(method, url, json=json)
        if not response.is_success:
            raise RuntimeError(f"Jira API error {response.status_code}: {response.text}")
        if response.status_code == 204:
            return None
        return response.json()

    # REST API v3
    async def get(self, path: str) -> dict:
        return await self._request("GET", f"/api/3{path}")

    async def post(self, path: str, body: dict) -> dict:
        return await self._request("POST", f"/api/3{path}", json=body)

    async def put(self, path: str, body: dict) -> dict | None:
        return await self._request("PUT", f"/api/3{path}", json=body)

    async def delete(self, path: str) -> dict | None:
        return await self._request("DELETE", f"/api/3{path}")

    # Agile REST API
    async def agile_get(self, path: str) -> dict:
        return await self._request("GET", f"/agile/1.0{path}")

    async def agile_post(self, path: str, body: dict) -> dict:
        return await self._request("POST", f"/agile/1.0{path}", json=body)

    async def agile_put(self, path: str, body: dict) -> dict | None:
        return await self._request("PUT", f"/agile/1.0{path}", json=body)


class JiraClient:
    def __init__(self) -> None:
        base_url = os.environ.get("JIRA_BASE_URL")
        email = os.environ.get("JIRA_EMAIL")
        api_token = os.environ.get("JIRA_API_TOKEN")

        if not all([base_url, email, api_token]):
            raise RuntimeError(
                "Missing required environment variables: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN"
            )

        self._default_base_url = base_url
        self._email = email
        self._api_token = api_token
        self._instances: dict[str, JiraInstance] = {}

    def instance_for(self, instance: str | None = None) -> JiraInstance:
        key = instance or "_default"
        if key not in self._instances:
            if not instance:
                base_url = self._default_base_url
            else:
                base_url = os.environ.get(f"JIRA_BASE_URL_{instance}")
                if not base_url:
                    raise RuntimeError(
                        f'Unknown Jira instance "{instance}". '
                        f"Set JIRA_BASE_URL_{instance} environment variable."
                    )
            self._instances[key] = JiraInstance(base_url, self._email, self._api_token)
        return self._instances[key]
