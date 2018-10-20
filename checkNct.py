from selenium.webdriver import Firefox
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.support import expected_conditions as expected
from selenium.webdriver.support.wait import WebDriverWait
import time

text = raw_input()
if __name__ == "__main__":
    options = Options()
    options.add_argument('-headless')
    driver = Firefox(executable_path='geckodriver', firefox_options=options)
    driver.get('https://www.ncts.ie/1263')
    driver.find_element_by_xpath("//button[@id='CloseCookie']").click()
    driver.refresh()
    nctInput=driver.find_element_by_xpath("//input[@name='RegistrationID']")
    nctInput.clear()
    nctInput.send_keys(text+ Keys.ENTER )
    WebDriverWait(driver, 10).until(expected.presence_of_element_located((By.ID, "confirmVehicleYes")))
    driver.find_element_by_xpath("//input[@id='confirmVehicleYes']").send_keys(Keys.ENTER)
    WebDriverWait(driver, 10).until(expected.presence_of_element_located((By.ID, "tab3")))
    print (driver.find_element_by_xpath('//*[@id="tab3"]/form[1]/div[2]/div[1]/div[1]/table/tbody/tr[1]/td').text)
    driver.quit()
