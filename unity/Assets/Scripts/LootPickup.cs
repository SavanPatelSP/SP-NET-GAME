using UnityEngine;

public enum LootKind
{
    Weapon,
    Armor,
    Med,
    Vehicle
}

public class LootPickup : MonoBehaviour
{
    public LootKind kind;
    public int weaponIndex;
    public bool taken;
}
