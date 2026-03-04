int i;
int num;
int max;
int min;

cout << "Escribe hasta 6 numeros: ";
cout << "\n";
cout << "01: ";
cin >> num;
cout << "\n";
max = num;
min = num;

i = 1;

while (i < 6) {
    cout << i+1;
    cout << ": ";
    cin >> num;
    cout << "\n";

    if (num > max) {
        max = num;
    }
    
    if (num < min) {
        min = num;
    }

    i = i + 1;
}

cout << "Numero mayor: ";
cout << max;
cout << "\n";
cout << "Numero menor: ";
cout << min;