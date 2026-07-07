import json
from pathlib import Path
import pytest
from playwright.sync_api import Page, expect
from pages.login_page import LoginPage
from pages.dashboard_page import DashboardPage

# Actual application URL running locally
BASE_URL = "http://localhost:3002/"
# Actual dashboard URL running locally
DASHBOARD_URL = "http://localhost:3002/"


def reset_lockout_user() -> None:
    """Helper to reset lockout status in database.json before running lockout test."""
    db_path = Path(__file__).resolve().parent.parent / "backend" / "database.json"
    if db_path.exists():
        try:
            with open(db_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            for user in data.get("users", []):
                if user.get("email") == "lockout@test.com":
                    user["failedAttempts"] = 0
                    user["locked"] = False
            with open(db_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Could not reset lockout user: {e}")


@pytest.fixture(autouse=True)
def setup(page: Page) -> None:
    """Before each test: navigate to the base URL."""
    login_page = LoginPage(page)
    login_page.navigate_to(BASE_URL)

@pytest.mark.xray(test_key="SCRUM-29")
def test_verify_user_can_login_with_valid_credentials(page: Page) -> None:
    login_page = LoginPage(page)
    dashboard_page = DashboardPage(page)

    # Step 1: Enter valid email in the login field (using demo customer account)
    valid_email = "customer@test.com"
    login_page.enter_email(valid_email)
    assert login_page.get_email_value() == valid_email, "Email input field is not filled with the correct email"

    # Step 2: Enter valid password in the password field
    valid_password = "password123"
    login_page.enter_password(valid_password)
    assert login_page.get_password_value() == valid_password, "Password input field is not filled with the correct password"

    # Step 3: Click on the login button
    login_page.click_login()
    dashboard_page.wait_for_load_state()

    # Expect: User is redirected to the Dashboard
    assert dashboard_page.is_visible(), "User was not redirected to the Dashboard"

@pytest.mark.xray(test_key="SCRUM-49")
def test_mandatory_fields_validation(page: Page) -> None:
    login_page = LoginPage(page)

    # Attempt login without entering credentials
    login_page.click_login()
    assert login_page.is_error_message_visible(), "Error message should be displayed when fields are empty"

@pytest.mark.xray(test_key="SCRUM-30")
def test_invalid_credentials_display_error(page: Page) -> None:
    login_page = LoginPage(page)

    login_page.enter_email("invalid@example.com")
    login_page.enter_password("wrongPassword")
    login_page.click_login()

    assert login_page.is_error_message_visible(), "Error message should be displayed for invalid credentials"

@pytest.mark.xray(test_key="SCRUM-31")
def test_account_lockout_after_five_failed_attempts(page: Page) -> None:
    reset_lockout_user()
    login_page = LoginPage(page)
    invalid_email = "lockout@test.com"
    wrong_password = "wrongPassword"

    # Perform 5 failed login attempts
    for i in range(1, 6):
        login_page.enter_email(invalid_email)
        login_page.enter_password(wrong_password)
        login_page.click_login()
        assert login_page.is_error_message_visible(), f"Error message should be displayed on attempt {i}"

    # Verify lockout message on the 6th attempt or after the 5th failure
    error_text = (login_page.get_error_message_text() or "").lower()
    is_locked_or_too_many_attempts = "locked" in error_text or "too many attempts" in error_text

    assert is_locked_or_too_many_attempts, f"Account should be locked after 5 failed attempts. Actual message: {error_text}"
