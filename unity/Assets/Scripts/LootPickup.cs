using UnityEngine;

public enum LootKind
{
    Weapon,
    Armor,
    Med
}

public class LootPickup : MonoBehaviour
{
    public LootKind kind;
    public int weaponIndex;
    public bool taken;
}
