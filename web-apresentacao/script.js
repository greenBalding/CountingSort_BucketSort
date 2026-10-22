"use strict";

const slides = Array.from(document.querySelectorAll(".slide"));
const labels = ["Início", "Objetivo"];
const previous = document.getElementById("previous");
const next = document.getElementById("next");
let current = 0;

function showSlide(index, moveFocus = false) {
  current = Math.max(0, Math.min(index, slides.length - 1));
  slides.forEach((slide, i) => { slide.hidden = i !== current; });
  previous.disabled = current === 0;
  next.disabled = current === slides.length - 1;
  document.getElementById("current-slide").textContent = String(current + 1).padStart(2, "0");
  document.getElementById("total-slides").textContent = String(slides.length).padStart(2, "0");
  document.getElementById("slide-label").textContent = labels[current].toLocaleUpperCase("pt-BR");
  document.getElementById("progress-fill").style.width = `${((current + 1) / slides.length) * 100}%`;
  document.getElementById("slide-status").textContent = `Tela ${current + 1} de ${slides.length}: ${labels[current]}`;
  if (moveFocus) {
    slides[current].querySelector("h1, h2").focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }
}

previous.addEventListener("click", () => showSlide(current - 1, true));
next.addEventListener("click", () => showSlide(current + 1, true));
document.querySelector(".brand").addEventListener("click", (event) => {
  event.preventDefault();
  showSlide(0, true);
});
document.addEventListener("keydown", (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
    event.preventDefault();
    showSlide(current + (event.key === "ArrowRight" ? 1 : -1), true);
  }
});
showSlide(0);
