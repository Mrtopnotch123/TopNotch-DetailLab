/* ==================================
   TOPNOTCH DETAIL LAB
   Website Functions
================================== */


// Smooth scrolling

document.querySelectorAll('a[href^="#"]').forEach(link => {

    link.addEventListener("click", function(e){

        const target = document.querySelector(
            this.getAttribute("href")
        );

        if(target){

            e.preventDefault();

            target.scrollIntoView({
                behavior:"smooth"
            });

        }

    });

});



// Quote Form

const quoteForm = document.getElementById("quote-form");


if(quoteForm){

    quoteForm.addEventListener("submit", function(e){

        e.preventDefault();


        const button = quoteForm.querySelector("button");


        button.innerHTML = "Request Sent ✓";


        button.style.background = "#28a745";


        setTimeout(()=>{

            button.innerHTML = "Send Request";

            button.style.background = "#d4af37";

            quoteForm.reset();


        },3000);


    });

}



// Scroll reveal animation

const sections = document.querySelectorAll(".section");


const observer = new IntersectionObserver((entries)=>{


    entries.forEach(entry=>{


        if(entry.isIntersecting){

            entry.target.style.opacity = "1";

            entry.target.style.transform =
            "translateY(0)";

        }


    });


},{
    threshold:.15
});



sections.forEach(section=>{


    section.style.opacity = "0";

    section.style.transform =
    "translateY(40px)";


    section.style.transition =
    "all .8s ease";


    observer.observe(section);


});



// Website loaded check

console.log(
"TopNotch Detail Lab website loaded successfully."
);
