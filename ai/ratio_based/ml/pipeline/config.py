TRAIN_CONFIG = {
    "input_dim": 9,
    "hidden_dims": [32, 16],
    "activation": "silu",
    "dropout": 0.1,

    "batch_size": 64,
    "epochs": 100,

    "optimizer": "adamw",
    "weight_decay": 1e-4,
    "learning_rate": 1e-3,

    "loss": "mse",

    # early stopping
    "early_stopping": True,
    "es_patience": 20, # epoch 기준
    "es_min_delta": 1e-4, # 최소 변화량
    "es_monitor": "loss", # loss | acc
}
