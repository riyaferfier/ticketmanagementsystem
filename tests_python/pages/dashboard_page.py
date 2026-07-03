from playwright.sync_api import Page, Locator


class DashboardPage:
    """Page Object Model representing the Dashboard Page."""

    def __init__(self, page: Page) -> None:
        self.page = page
        self.dashboard_container: Locator = page.locator("[data-testid='dashboard-page']")
        self.welcome_title: Locator = page.locator("[data-testid='dashboard-welcome-title']")

    def get_url(self) -> str:
        return self.page.url

    def wait_for_load_state(self) -> None:
        self.page.wait_for_load_state()
        try:
            self.dashboard_container.wait_for(state="visible", timeout=10000)
        except Exception:
            pass

    def is_visible(self) -> bool:
        try:
            self.dashboard_container.wait_for(state="visible", timeout=5000)
            return True
        except Exception:
            return False
