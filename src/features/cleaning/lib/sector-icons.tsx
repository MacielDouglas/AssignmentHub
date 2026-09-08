"use client";

import {
	FaBroom,
	FaChair,
	FaDoorOpen,
	FaFan,
	FaLeaf,
	FaToilet,
} from "react-icons/fa";
import {
	HiOutlineArchiveBox,
	HiOutlineCube,
	HiOutlineMicrophone,
	HiOutlinePresentationChartLine,
	HiOutlineSparkles,
	HiOutlineTag,
	HiOutlineTrash,
	HiOutlineWindow,
} from "react-icons/hi2";

function normalize(value: string): string {
	return value
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "");
}

type Props = {
	name: string;
	className?: string;
};

/**
 * Retorna o ícone estático correspondente ao nome do setor.
 * Cada branch retorna um componente estático (sem `<Icon />` dinâmico),
 * para não violar a regra "Cannot create components during render".
 */
export function SectorIcon({ name, className }: Props) {
	const n = normalize(name);
	const cls = className ?? "h-4 w-4 shrink-0";

	if (
		/(banheiro|bano|vaso|mictorio|sanitario|toilet|restroom|servicio|aseo)/.test(
			n,
		)
	) {
		return <FaToilet className={cls} aria-hidden />;
	}
	if (
		/(lixo|lixeira|descartar|basura|desecho|residuo|recoleccion|recolectar|recoger)/.test(
			n,
		)
	) {
		return <HiOutlineTrash className={cls} aria-hidden />;
	}
	if (
		/(abastec|suministro|reponer|dispenser|dispensador|papel|toalha|sabonete|jabon|alcool|alcohol|copo)/.test(
			n,
		)
	) {
		return <HiOutlineArchiveBox className={cls} aria-hidden />;
	}
	if (
		/(varrer|barrer|aspirar|trapear|mop|teia|telarana|aranha|pano|chao|piso|suelo|polvo)/.test(
			n,
		)
	) {
		return <FaBroom className={cls} aria-hidden />;
	}
	if (/(cadeira|silla|assento|asiento|encosto|auditorio)/.test(n)) {
		return <FaChair className={cls} aria-hidden />;
	}
	if (/(microfone|microfono|cabo|cable|som|sonido|audio)/.test(n)) {
		return <HiOutlineMicrophone className={cls} aria-hidden />;
	}
	if (/(porta|puerta|portao|porton|grade|reja|verja)/.test(n)) {
		return <FaDoorOpen className={cls} aria-hidden />;
	}
	if (
		/(janela|ventana|vidro|persiana|cortina|parede|pared|mancha|revestimento|divisoria|pingadeira)/.test(
			n,
		)
	) {
		return <HiOutlineWindow className={cls} aria-hidden />;
	}
	if (
		/(tribuna|palco|escenario|plataforma|mesa|bebedouro|bebedero|balcao)/.test(
			n,
		)
	) {
		return <HiOutlinePresentationChartLine className={cls} aria-hidden />;
	}
	if (
		/(calcada|acera|externa|exterior|estacionamento|jardim|jardin|grama|cesped|erva|hierba|concretada|hormigon|lavar)/.test(
			n,
		)
	) {
		return <FaLeaf className={cls} aria-hidden />;
	}
	if (/(ventilador)/.test(n)) {
		return <FaFan className={cls} aria-hidden />;
	}
	if (
		/(sala de limpeza|sala de limpieza|organizacao|organizacion|organizar)/.test(
			n,
		)
	) {
		return <HiOutlineCube className={cls} aria-hidden />;
	}
	if (/(limpeza|limpieza|limpar|limpiar)/.test(n)) {
		return <HiOutlineSparkles className={cls} aria-hidden />;
	}
	return <HiOutlineTag className={cls} aria-hidden />;
}
