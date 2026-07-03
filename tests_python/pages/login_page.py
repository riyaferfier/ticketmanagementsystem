from typing import Optional
from playwright.sync_api import Page, Locator


class LoginPage:
    """Page Object Model representing the Login Page."""

    def __init__(self, page: Page) -> None:
        self.page = page
        # Using exact data-testid attributes defined in the React app
        self.email_input: Locator = page.locator("[data-testid='login-email-input']")
        self.password_input: Locator = page.locator("[data-testid='login-password-input']")
        self.login_button: Locator = page.locator("[data-testid='login-submit-btn']")
        self.error_message: Locator = page.locator("[data-testid='login-error-banner']")

    def navigate_to(self, url: str) -> None:
        self.page.goto(url)

    def enter_email(self, email: str) -> None:
        self.email_input.fill(email)

    def enter_password(self, password: str) -> None:
        self.password_input.fill(password)

    def click_login(self) -> None:
        self.login_button.click()

    def get_email_value(self) -> str:
        return self.email_input.input_value()

    def get_password_value(self) -> str:
        return self.password_input.input_value()

    def get_error_message_text(self) -> Optional[str]:
        try:
            self.error_message.wait_for(state="visible", timeout=5000)
            return self.error_message.text_content()
        except Exception:
            return None

    def is_error_message_visible(self) -> bool:
        try:
            self.error_message.wait_for(state="visible", timeout=5000)
            return True
        except Exception:
            return False
