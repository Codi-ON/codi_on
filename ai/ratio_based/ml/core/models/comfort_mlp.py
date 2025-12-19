import torch.nn as nn

# 구조만 생성, train 시 config에서 지정한 수치를 사용하여 동작
class ComfortMLP(nn.Module):
    def __init__(
        self,
        input_dim: int,
        hidden_dims: list = [32, 16],
        activation: str = "relu",
        dropout: float = 0.1
    ):
        super().__init__()

        act_fn = self._get_activation(activation)

        layers = []
        prev_dim = input_dim

        for h_dim in hidden_dims:
            layers.append(nn.Linear(prev_dim, h_dim))
            layers.append(act_fn)
            if dropout > 0:
                layers.append(nn.Dropout(dropout))
            prev_dim = h_dim

        # output layer
        layers.append(nn.Linear(prev_dim, 1))

        self.net = nn.Sequential(*layers)

    def _get_activation(self, name: str):
        name = name.lower()

        if name == "relu":
            return nn.ReLU()
        elif name == "gelu":
            return nn.GELU()
        elif name == "silu" or name == "swish":
            return nn.SiLU()
        elif name == "tanh":
            return nn.Tanh()
        else:
            raise ValueError(f"Unsupported activation: {name}")

    def forward(self, x):
        return self.net(x)
