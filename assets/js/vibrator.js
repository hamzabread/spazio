const vibrator = () => {
    // Vibrate the device if supported on each link click
    const links = document.querySelectorAll('body a');
    links.forEach(link => {
        link.addEventListener('click', () => {
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
        });
    });
}

export { vibrator }