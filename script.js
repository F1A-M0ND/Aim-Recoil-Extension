function rollD12() {
    return Math.floor(Math.random() * 12) + 1;
}


document.getElementById("fire").onclick = function () {

    let accuracy = Number(
        document.getElementById("accuracy").value
    );

    let x = rollD12();
    let y = rollD12();

    document.getElementById("result").innerHTML =
        `
        X = ${x}<br>
        Y = ${y}<br>
        Accuracy = ${accuracy}
        `;
};