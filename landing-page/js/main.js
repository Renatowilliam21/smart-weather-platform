/**
 * Interações gerais da landing page — JavaScript puro (sem jQuery/frameworks).
 */

document.addEventListener("DOMContentLoaded", () => {

	// ---------- Sombra/opacidade no menu ao rolar a página ----------
	const menu = document.getElementById("menuPrincipal");
	if (menu) {
		const alternarClasseMenu = () => {
			menu.classList.toggle("rolado", window.scrollY > 12);
		};
		alternarClasseMenu();
		window.addEventListener("scroll", alternarClasseMenu, { passive: true });
	}

	// ---------- Fecha o menu mobile ao clicar em um link ----------
	const navMenu = document.getElementById("navMenu");
	if (navMenu && window.bootstrap) {
		navMenu.querySelectorAll(".nav-link").forEach(link => {
			link.addEventListener("click", () => {
				const instancia = window.bootstrap.Collapse.getInstance(navMenu);
				if (instancia && navMenu.classList.contains("show")) {
					instancia.hide();
				}
			});
		});
	}

	// ---------- Relógio do painel de leituras (hero) ----------
	const relogio = document.querySelector("[data-relogio]");
	if (relogio) {
		const atualizarRelogio = () => {
			relogio.textContent = new Date().toLocaleTimeString("pt-BR", { hour12: false });
		};
		atualizarRelogio();
		setInterval(atualizarRelogio, 1000);
	}

	// ---------- Revelação suave das seções ao rolar ----------
	const elementosRevelaveis = document.querySelectorAll(
		".card-sensor, .depoimento, .fluxo li, .formulario, .lista-contato"
	);
	elementosRevelaveis.forEach(el => el.classList.add("reveal"));

	if ("IntersectionObserver" in window) {
		const observador = new IntersectionObserver(
			(entradas) => {
				entradas.forEach(entrada => {
					if (entrada.isIntersecting) {
						entrada.target.classList.add("is-visible");
						observador.unobserve(entrada.target);
					}
				});
			},
			{ threshold: 0.15 }
		);
		elementosRevelaveis.forEach(el => observador.observe(el));
	} else {
		elementosRevelaveis.forEach(el => el.classList.add("is-visible"));
	}

	// ---------- Formulário de contato (demonstração, sem backend) ----------
	const formulario = document.querySelector(".formulario");
	if (formulario) {
		formulario.addEventListener("submit", (evento) => {
			evento.preventDefault();
			if (!formulario.checkValidity()) {
				formulario.reportValidity();
				return;
			}
			const nota = formulario.querySelector("[data-nota]");
			if (nota) {
				nota.hidden = false;
			}
			formulario.reset();
		});
	}
});
