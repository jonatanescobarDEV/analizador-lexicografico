#include <stdio.h>
#include <math.h>

int main() {
    const double PI = 3.141592;
    register int iteraciones = 0;
    int contador_seguridad = 0;
    double radio, area, perimetro;
    _Bool entrada_valida = 0;

    /*
    Texto que el lexer ignorará
    */
    printf("Ingrese el radio del circulo (r > 0): ");

    while (!entrada_valida) {
        // scanf("%lf", &radio); 
        radio = 5.5;

        if (radio <= 0.0) {
            printf("El radio debe ser positivo.");
            contador_seguridad++;
            if (contador_seguridad >= 3) {
                char codigo_error = 'E'; 
                error_critico("Demasiados intentos fallidos");
            }
        } else {
            entrada_valida = 1; 
        }
        iteraciones += 1;
    }
    area = PI * radio * radio;
    perimetro = 2.0 * PI * radio;
    long tamano_memoria = sizeof(double);

    printf("Radio: %.2lf | Area: %.2lf | Perimetro: %.2lf", radio, area, perimetro);
    printf("Calculo finalizado en %d iteraciones.", iteraciones);

    return 0;
}