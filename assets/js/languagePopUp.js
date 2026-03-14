
const createPopUp = () => {
   
  // Create the pop-up container
  const popupContainer = document.createElement('ul');
  popupContainer.classList.add('gh-subnav-language-header');

  // Create the language options
  const languages = [
    { code: 'it', name: 'Italiano', url:'https://www.spaziocrypto.com/' },
    { code: 'en', name: 'English', url: 'https://en.spaziocrypto.com/' },
    { code: 'fr', name: 'Français', url: 'https://fr.spaziocrypto.com/' },
    { code: 'es', name: 'Español', url: 'https://es.spaziocrypto.com/' },
    { code: 'de', name: 'Deutsch', url: 'https://de.spaziocrypto.com/' },
    { code: 'ru', name: 'Русский', url: 'https://ru.spaziocrypto.com/' },
    { code: 'ja', name: '日本語', url: 'https://ja.spaziocrypto.com/' },
    { code: 'zh', name: '中文', url: 'https://zh.spaziocrypto.com/' },
  ];
    
  // Create the language options in the pop-up
  languages.forEach((lang) => {
        const langItem = document.createElement('li');
        langItem.classList.add('gh-subnav-item-lang');
            const langOption = document.createElement('a');
            langOption.classList.add('gh-subnav-item-link');
            langOption.textContent = lang.name;
            langOption.href = lang.url;
    
    langItem.appendChild(langOption);
    popupContainer.appendChild(langItem);
  });

  // Select the target div element
  const targetDiv = document.querySelector('.popup-launcher');

  // Add the pop-up container to the target div
  targetDiv.appendChild(popupContainer);

}

export { createPopUp };


