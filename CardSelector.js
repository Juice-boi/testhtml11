document.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll(".CardDisplay");
    const desc = document.querySelector(".cardDescription");
    let currentIndex = 0;

    function showCards(index) {
    cards.forEach((card, i) => card.classList.remove("CardLeft2","CardLeft","CardCenter","CardRight","CardRight2","active"));

    const total = cards.length;
    const left2 = (index - 2 + total) % total;
    const left1 = (index - 1 + total) % total;
    const right1 = (index + 1) % total;
    const right2 = (index + 2) % total;

    cards[left2].classList.add("CardLeft2", "active");
    cards[left1].classList.add("CardLeft", "active");
    cards[index].classList.add("CardCenter", "active");
    cards[right1].classList.add("CardRight", "active");
    cards[right2].classList.add("CardRight2", "active");

    desc.textContent = cards[index].dataset.desc;
    }
    // Initial display
    showCards(currentIndex);

    document.getElementById("nextCard").addEventListener("click", () => {
        currentIndex = (currentIndex + 1) % cards.length;
        showCards(currentIndex);
    });

    document.getElementById("prevCard").addEventListener("click", () => {
        currentIndex = (currentIndex - 1 + cards.length) % cards.length;
        showCards(currentIndex);
    });
});