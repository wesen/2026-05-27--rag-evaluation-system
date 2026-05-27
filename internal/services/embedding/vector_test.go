package embedding

import "testing"

func TestEncodeDecodeFloat32Vector(t *testing.T) {
	input := []float32{1, -2.5, 0, 42.25}
	blob := EncodeFloat32Vector(input)
	if len(blob) != len(input)*4 {
		t.Fatalf("expected blob length %d, got %d", len(input)*4, len(blob))
	}
	got, err := DecodeFloat32Vector(blob)
	if err != nil {
		t.Fatalf("decode vector: %v", err)
	}
	if len(got) != len(input) {
		t.Fatalf("expected %d values, got %d", len(input), len(got))
	}
	for i := range input {
		if got[i] != input[i] {
			t.Fatalf("value %d: expected %v got %v", i, input[i], got[i])
		}
	}
}

func TestDecodeFloat32VectorRejectsInvalidLength(t *testing.T) {
	if _, err := DecodeFloat32Vector([]byte{1, 2, 3}); err == nil {
		t.Fatal("expected invalid length to fail")
	}
}
