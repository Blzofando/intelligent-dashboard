import { Course } from '../../types';

export const courseData: Course = {
    id: "html-course",
    slug: "html",
    title: "HTML e CSS: O Início (incluindo 5 Projetos)",
    description: "Aprenda HTML e CSS do zero com 5 projetos práticos. Domine as bases do desenvolvimento web front-end.",
    thumbnail: "/courses/html-thumb.png",
    categories: [
        {
            name: "Todos os Módulos",
            moduleIds: ["html-Module-1", "html-Module-2", "html-Module-3", "html-Module-4", "html-Module-5", "html-Module-6", "html-Module-7", "html-Module-8"]
        }
    ],
    modules: [
        {
            id: "html-Module-1",
            title: "01 - Introdução",
            lessons: [
                { id: "html-F001", title: "01. Apresentação do curso" },
                { id: "html-F002", title: "02. Apresentação dos projetos" },
                { id: "html-F003", title: "03. O que é e para que serve o HTML" },
                { id: "html-F004", title: "04. O que é e para que serve o CSS" },
                { id: "html-F005", title: "05. Como pesquisar problemas/dúvidas de código no Stackoverflow" },
                { id: "html-F006", title: "06. Como pesquisar problemas/dúvidas de código no Google" },
                { id: "html-F007", title: "07. Como utilizar a ferramenta de inspecionar elemento" },
                { id: "html-F008", title: "08. Instalando o Sublime Text 3" }
            ],
        },
        {
            id: "html-Module-2",
            title: "02 - Aprendendo HTML",
            lessons: [
                { id: "html-F009", title: "01. O que é HTML?" },
                { id: "html-F010", title: "02. O que são tags" },
                { id: "html-F011", title: "03. Conhecendo os headings" },
                { id: "html-F012", title: "04. Comentários no HTML" },
                { id: "html-F013", title: "05. Conhecendo a tag <a>" },
                { id: "html-F014", title: "06. Conhecendo a tag <img>" },
                { id: "html-F015", title: "07. Conhecendo a tag <table>" },
                { id: "html-F016", title: "08. Listas no HTML - tag <ol>" },
                { id: "html-F017", title: "09. Listas no HTML - tag <ul>" },
                { id: "html-F018", title: "10. Formulário no HTML: como criar um" },
                { id: "html-F019", title: "11. Formulário no HTML: conhecendo os elementos principais" },
                { id: "html-F020", title: "12. Formulário no HTML: conhecendo os atributos dos formulários" },
                { id: "html-F021", title: "13. As metatags essenciais para os projetos web" },
                { id: "html-F022", title: "14. Introdução ao HTML semântico" }
            ],
        },
        {
            id: "html-Module-3",
            title: "03 - Aprendendo CSS",
            lessons: [
                { id: "html-F023", title: "01. O que é CSS" },
                { id: "html-F024", title: "02. Adicionado CSS aos projetos" },
                { id: "html-F025", title: "03. CSS Inline" },
                { id: "html-F026", title: "04. Internal CSS" },
                { id: "html-F027", title: "05. Sintaxe do CSS e comentários" },
                { id: "html-F028", title: "06. Classes e Ids" },
                { id: "html-F029", title: "07. As possibilidades de adicionar cores com CSS" },
                { id: "html-F030", title: "08. Adicionando background com CSS" },
                { id: "html-F031", title: "09. Adicionado fontes com CSS" },
                { id: "html-F032", title: "10. Explicando o conceito de Box model" },
                { id: "html-F033", title: "11. Box model na prática - Padding" },
                { id: "html-F034", title: "12. Box model na prática -Border" },
                { id: "html-F035", title: "13. Box model na prática - Margin" },
                { id: "html-F036", title: "14. Entendendo a propriedade display" },
                { id: "html-F037", title: "15. Entendendo positions - Static" },
                { id: "html-F038", title: "16. Entendendo positions - Relative" },
                { id: "html-F039", title: "17. Entendendo positions - Absolute" },
                { id: "html-F040", title: "18. Entendendo positions - Fixed" },
                { id: "html-F041", title: "19. Entendendo positions - Sticky" },
                { id: "html-F042", title: "20. Resumo de positions" },
                { id: "html-F043", title: "21. Conhecendo o float" },
                { id: "html-F044", title: "22. Utilizando clear para ajustar o float" },
                { id: "html-F045", title: "23. Unidades de medida - **px**" },
                { id: "html-F046", title: "24. Unidades de medida - **%**" },
                { id: "html-F047", title: "25. Unidades de medida - **em **e **rem**" }
            ],
        },
        {
            id: "html-Module-4",
            title: "04 - Projeto 1",
            lessons: [
                { id: "html-F048", title: "01. Introdução do projeto" },
                { id: "html-F049", title: "02. Criando o projeto" },
                { id: "html-F050", title: "03. Início da estrutura do HTML e estratégia de construção" },
                { id: "html-F051", title: "04. Fazendo o HTML do projeto" },
                { id: "html-F052", title: "05. Iniciando o CSS - cabeçalho e container" },
                { id: "html-F053", title: "06. Finalizando o projeto" }
            ],
        },
        {
            id: "html-Module-5",
            title: "05 - Projeto 2",
            lessons: [
                { id: "html-F054", title: "01. Introdução do projeto" },
                { id: "html-F055", title: "02. Criando o projeto" },
                { id: "html-F056", title: "03. Iniciando o formulário" },
                { id: "html-F057", title: "04. Finalizando o HTML do projeto" },
                { id: "html-F058", title: "05. Iniciando o CSS" },
                { id: "html-F059", title: "06. Finalizando o projeto" }
            ],
        },
        {
            id: "html-Module-6",
            title: "06 - Projeto 3",
            lessons: [
                { id: "html-F060", title: "01. Introdução do projeto" },
                { id: "html-F061", title: "02. Iniciando o projeto" },
                { id: "html-F062", title: "03. Criando o HTML do header" },
                { id: "html-F063", title: "04. Finalizando CSS do header" },
                { id: "html-F064", title: "05. Construindo o HTML da seção de serviços" },
                { id: "html-F065", title: "06. CSS da seção de serviços" },
                { id: "html-F066", title: "07. HTML da seção de especialidades" },
                { id: "html-F067", title: "08. Finalizando seção de especialidades" },
                { id: "html-F068", title: "09. Criando formulário da página" },
                { id: "html-F069", title: "10. CSS do formulário" },
                { id: "html-F070", title: "11. Conclusão do projeto" }
            ],
        },
        {
            id: "html-Module-7",
            title: "07 - Projeto 4: Site do Google",
            lessons: [
                { id: "html-F071", title: "01. Introdução do projeto" },
                { id: "html-F072", title: "02. Configurações do projeto" },
                { id: "html-F073", title: "03. Barra de navegação superior" },
                { id: "html-F074", title: "04. Corpo do site" },
                { id: "html-F075", title: "05. Rodapé do site e conclusão" }
            ],
        },
        {
            id: "html-Module-8",
            title: "08 - Projeto 5: Página de Contato (com Flexbox e responsivo)",
            lessons: [
                { id: "html-F076", title: "01. Apresentação do projeto" },
                { id: "html-F077", title: "02. Estrutura base do projeto" },
                { id: "html-F078", title: "03. Criando o HTML" },
                { id: "html-F079", title: "04. CSS do seção de endereços" },
                { id: "html-F080", title: "05. CSS do formulário" },
                { id: "html-F081", title: "06. Responsividade e conclusão do projeto" }
            ],
        }
    ],
};
