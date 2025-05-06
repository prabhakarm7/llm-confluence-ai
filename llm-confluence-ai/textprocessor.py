from bs4 import BeautifulSoup
from langchain.text_splitter import RecursiveCharacterTextSplitter

class TextProcessor:
    def chunk_html(self, html_text):
        soup = BeautifulSoup(html_text, 'html.parser')
        plain_text = soup.get_text()
        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        return splitter.split_text(plain_text)
